namespace NoteNest.Api.Models;

public enum SharePermission { Viewer = 0, Editor = 1 }
public enum MediaType { Image = 0, Video = 1 }

// Plain classes only (ids instead of object links) so they serialise cleanly to JSON.
public class User
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";          // stored lower-case
    public string DisplayName { get; set; } = "";
    public string PasswordHash { get; set; } = "";   // PBKDF2 hash, never the password
    public int FailedLogins { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class Note
{
    public int Id { get; set; }
    public string OwnerId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public int? CategoryId { get; set; }
    public bool IsPinned { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

public class NoteAttachment
{
    public int Id { get; set; }
    public int NoteId { get; set; }
    public string FileName { get; set; } = "";
    public string StorageKey { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long FileSize { get; set; }
    public MediaType MediaType { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class Category
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class Tag
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
}

public class NoteTag
{
    public int NoteId { get; set; }
    public int TagId { get; set; }
}

public class NoteShare
{
    public int Id { get; set; }
    public int NoteId { get; set; }
    public string SharedWithUserId { get; set; } = "";
    public SharePermission Permission { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
