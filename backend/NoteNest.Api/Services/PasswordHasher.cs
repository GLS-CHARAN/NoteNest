using System.Security.Cryptography;

namespace NoteNest.Api.Services;

/// PBKDF2-SHA256 with a random salt per password. Stored as "v1.iterations.salt.hash".
public static class PasswordHasher
{
    private const int Iterations = 210_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return $"v1.{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public static bool Verify(string stored, string password)
    {
        var parts = stored.Split('.');
        if (parts.Length != 4 || parts[0] != "v1" || !int.TryParse(parts[1], out var iterations)) return false;
        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    /// Returns a message if the password breaks the rules, otherwise null.
    public static string? Problem(string pw)
    {
        if (pw.Length < 8) return "Password must be at least 8 characters.";
        if (!pw.Any(char.IsLower)) return "Password needs a lowercase letter.";
        if (!pw.Any(char.IsUpper)) return "Password needs an uppercase letter.";
        if (!pw.Any(char.IsDigit)) return "Password needs a number.";
        return null;
    }
}
