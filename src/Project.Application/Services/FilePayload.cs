namespace Project.Application.Services;

public sealed class FilePayload
{
    public Stream Stream { get; set; } = Stream.Null;

    public string ContentType { get; set; } = "application/octet-stream";

    public string FileName { get; set; } = "download.bin";
}
