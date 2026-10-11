using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Features;
using System.Text.Json.Serialization;
using NoteNest.Api.Data;
using NoteNest.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// The "database": one JSON file. Change JsonDb:Path in appsettings.json to move it.
var dbPath = builder.Configuration["JsonDb:Path"] ?? "storage/json.db";
if (!Path.IsPathRooted(dbPath)) dbPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
builder.Services.AddSingleton(new JsonDb(dbPath));
builder.Services.AddSingleton<IMediaStorage, LocalMediaStorage>();

// Cookie login: a signed, HttpOnly cookie (JavaScript can never read it). No tokens in localStorage.
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "NoteNest.Auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;   // blocks cross-site POSTs -> CSRF protection
        o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
        // An API answers 401/403 instead of redirecting to a login page.
        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 314_572_800);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 314_572_800);

var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
