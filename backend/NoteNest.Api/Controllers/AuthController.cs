using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int MaxFailures = 5;
    private static readonly TimeSpan LockoutTime = TimeSpan.FromMinutes(5);
    private readonly JsonDb _db;
    public AuthController(JsonDb db) => _db = db;

    private Task SignInAsync(UserDto u)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, u.Id),
            new Claim(ClaimTypes.Name, u.DisplayName),
            new Claim(ClaimTypes.Email, u.Email)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
            new AuthenticationProperties { IsPersistent = true });
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        var problem = PasswordHasher.Problem(dto.Password);
        if (problem is not null) return BadRequest(new { message = problem });

        var email = dto.Email.Trim().ToLowerInvariant();
        var hash = PasswordHasher.Hash(dto.Password);   // slow on purpose, so do it outside the DB lock

        var outcome = _db.Write(d =>
        {
            if (d.Users.Any(u => u.Email == email))
                return Outcome<UserDto>.Fail(409, "An account with this email already exists.");
            var user = new User
            {
                Id = Guid.NewGuid().ToString("N"), Email = email, DisplayName = dto.DisplayName.Trim(),
                PasswordHash = hash, CreatedAtUtc = DateTime.UtcNow
            };
            d.Users.Add(user);
            return Outcome<UserDto>.Success(new UserDto(user.Id, user.Email, user.DisplayName), 201);
        });
        if (!outcome.Ok) return StatusCode(outcome.Status, new { message = outcome.Message });

        await SignInAsync(outcome.Value!);
        return StatusCode(201, outcome.Value);
    }

    private record LoginInfo(string Id, string Hash, DateTime? LockoutEndUtc);

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        const string bad = "Email or password is incorrect.";
        var email = dto.Email.Trim().ToLowerInvariant();

        var info = _db.Read(d => d.Users.Where(u => u.Email == email)
            .Select(u => new LoginInfo(u.Id, u.PasswordHash, u.LockoutEndUtc)).FirstOrDefault());
        if (info is null) return Unauthorized(new { message = bad });
        if (info.LockoutEndUtc > DateTime.UtcNow)
            return StatusCode(429, new { message = "Too many attempts. Try again in a few minutes." });

        var passwordOk = PasswordHasher.Verify(info.Hash, dto.Password);   // outside the lock

        var outcome = _db.Write(d =>
        {
            var u = d.Users.First(x => x.Id == info.Id);
            if (!passwordOk)
            {
                u.FailedLogins++;
                if (u.FailedLogins >= MaxFailures) { u.LockoutEndUtc = DateTime.UtcNow + LockoutTime; u.FailedLogins = 0; }
                return Outcome<UserDto>.Fail(401, bad);
            }
            u.FailedLogins = 0;
            u.LockoutEndUtc = null;
            return Outcome<UserDto>.Success(new UserDto(u.Id, u.Email, u.DisplayName));
        });
        if (!outcome.Ok) return StatusCode(outcome.Status, new { message = outcome.Message });

        await SignInAsync(outcome.Value!);
        return outcome.Value!;
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = _db.Read(d => d.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Email, u.DisplayName)).FirstOrDefault());
        if (user is null)
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }
        return user;
    }
}
