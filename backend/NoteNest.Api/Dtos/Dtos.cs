using System.ComponentModel.DataAnnotations;
using NoteNest.Api.Models;

namespace NoteNest.Api.Dtos;

public record RegisterDto(
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(100, MinimumLength = 8)] string Password,
    [Required, StringLength(100, MinimumLength = 2)] string DisplayName);

public record LoginDto([Required, EmailAddress] string Email, [Required] string Password);

public record UserDto(string Id, string Email, string DisplayName);

public record NoteSaveDto(
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(20000)] string? Content,
    int? CategoryId,
    List<string>? Tags,
    bool IsPinned);

public record PinDto(bool IsPinned);
public record TagNameDto([Required, StringLength(30, MinimumLength = 1)] string Name);

public record NoteSummaryDto(
    int Id, string Title, string Preview, int? CategoryId, string? CategoryName,
    List<string> Tags, bool IsPinned, DateTime CreatedAtUtc, DateTime UpdatedAtUtc,
    int? ThumbnailAttachmentId, bool HasImages, bool HasVideos,
    bool IsShared, string OwnerName, string Role);

public record AttachmentDto(int Id, string FileName, string ContentType, long FileSize, string MediaType, string Url);
public record ShareDto(int Id, string UserId, string Email, string DisplayName, string Permission, DateTime CreatedAtUtc);
public record TagDto(int Id, string Name);

public record NoteDetailDto(
    int Id, string Title, string Content, int? CategoryId, string? CategoryName,
    List<TagDto> Tags, bool IsPinned, DateTime CreatedAtUtc, DateTime UpdatedAtUtc,
    string OwnerName, string Role, List<AttachmentDto> Attachments, List<ShareDto>? Shares);

public record PagedResult<T>(List<T> Items, int Page, int PageSize, int TotalCount);

public record CategoryDto(int Id, string Name);
public record CategorySaveDto([Required, StringLength(60, MinimumLength = 1)] string Name);

public record ShareCreateDto([Required, EmailAddress] string Email, SharePermission Permission);
