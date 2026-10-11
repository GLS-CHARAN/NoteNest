using NoteNest.Api.Models;

namespace NoteNest.Api.Services;

public record MediaCheck(bool Ok, string? Error, MediaType MediaType, string Extension, string ContentType);

/// Validates by extension, declared content type, size AND the file's real first bytes ("magic numbers").
public static class MediaValidator
{
    public static MediaCheck Validate(string fileName, string declaredContentType, long length,
        byte[] header, long maxImageBytes, long maxVideoBytes)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        MediaCheck Fail(string msg) => new(false, msg, MediaType.Image, "", "");

        if (length <= 0) return Fail($"'{fileName}' is empty.");

        switch (ext)
        {
            case ".jpg" or ".jpeg":
                if (declaredContentType != "image/jpeg") return Fail($"'{fileName}': content type does not match.");
                if (length > maxImageBytes) return Fail($"'{fileName}' is larger than {maxImageBytes / 1048576} MB.");
                if (!(header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF))
                    return Fail($"'{fileName}' is not a valid JPEG.");
                return new(true, null, MediaType.Image, ".jpg", "image/jpeg");

            case ".png":
                if (declaredContentType != "image/png") return Fail($"'{fileName}': content type does not match.");
                if (length > maxImageBytes) return Fail($"'{fileName}' is larger than {maxImageBytes / 1048576} MB.");
                if (!(header.Length >= 4 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47))
                    return Fail($"'{fileName}' is not a valid PNG.");
                return new(true, null, MediaType.Image, ".png", "image/png");

            case ".webp":
                if (declaredContentType != "image/webp") return Fail($"'{fileName}': content type does not match.");
                if (length > maxImageBytes) return Fail($"'{fileName}' is larger than {maxImageBytes / 1048576} MB.");
                if (!(header.Length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                      && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P'))
                    return Fail($"'{fileName}' is not a valid WebP.");
                return new(true, null, MediaType.Image, ".webp", "image/webp");

            case ".mp4":
                if (declaredContentType != "video/mp4") return Fail($"'{fileName}': content type does not match.");
                if (length > maxVideoBytes) return Fail($"'{fileName}' is larger than {maxVideoBytes / 1048576} MB.");
                if (!(header.Length >= 8 && header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p'))
                    return Fail($"'{fileName}' is not a valid MP4.");
                return new(true, null, MediaType.Video, ".mp4", "video/mp4");

            case ".webm":
                if (declaredContentType != "video/webm") return Fail($"'{fileName}': content type does not match.");
                if (length > maxVideoBytes) return Fail($"'{fileName}' is larger than {maxVideoBytes / 1048576} MB.");
                if (!(header.Length >= 4 && header[0] == 0x1A && header[1] == 0x45 && header[2] == 0xDF && header[3] == 0xA3))
                    return Fail($"'{fileName}' is not a valid WebM.");
                return new(true, null, MediaType.Video, ".webm", "video/webm");

            default:
                return Fail($"'{fileName}': only JPEG, PNG, WebP, MP4 and WebM files are allowed.");
        }
    }
}
