namespace NoteNest.Api.Services;

/// Result of a database operation: a value + HTTP status, or an error status + message.
public record Outcome<T>(T? Value, int Status, string? Message)
{
    public bool Ok => Status < 400;
    public static Outcome<T> Success(T value, int status = 200) => new(value, status, null);
    public static Outcome<T> Fail(int status, string? message = null) => new(default, status, message);
}
