using NoteNest.Api.Models;
using NoteNest.Api.Services;
using Xunit;

namespace NoteNest.Tests;

public class MediaValidatorTests
{
    private const long Img = 10 * 1024 * 1024, Vid = 100 * 1024 * 1024;
    private static readonly byte[] Png = { 0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
    private static readonly byte[] Exe = { (byte)'M', (byte)'Z', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

    [Fact]
    public void Accepts_real_png()
    {
        var r = MediaValidator.Validate("a.png", "image/png", 1000, Png, Img, Vid);
        Assert.True(r.Ok);
        Assert.Equal(MediaType.Image, r.MediaType);
    }

    [Fact]
    public void Rejects_executable_renamed_to_png() =>
        Assert.False(MediaValidator.Validate("evil.png", "image/png", 1000, Exe, Img, Vid).Ok);

    [Fact]
    public void Rejects_mismatched_content_type() =>
        Assert.False(MediaValidator.Validate("a.png", "text/html", 1000, Png, Img, Vid).Ok);

    [Fact]
    public void Rejects_unknown_extension_and_oversize_image()
    {
        Assert.False(MediaValidator.Validate("a.gif", "image/gif", 1000, Png, Img, Vid).Ok);
        Assert.False(MediaValidator.Validate("a.png", "image/png", Img + 1, Png, Img, Vid).Ok);
    }

    [Fact]
    public void Accepts_mp4_header()
    {
        var mp4 = new byte[] { 0, 0, 0, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', 0, 0, 0, 0, 0, 0, 0, 0 };
        var r = MediaValidator.Validate("clip.mp4", "video/mp4", 5000, mp4, Img, Vid);
        Assert.True(r.Ok);
        Assert.Equal(MediaType.Video, r.MediaType);
    }
}
