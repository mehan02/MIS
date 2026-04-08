using FluentValidation;
using Project.Application.DTOs.Reports;

namespace Project.Application.Validators;

public sealed class CreateReportRequestDtoValidator : AbstractValidator<CreateReportRequestDto>
{
    private const long MaxFileSizeBytes = 300 * 1024 * 1024;

    public CreateReportRequestDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(x => x.Department)
            .MaximumLength(100);

        RuleFor(x => x.ContactNumber)
            .MaximumLength(20);

        RuleFor(x => x.File)
            .Must(file => file == null || file.Length <= MaxFileSizeBytes)
            .WithMessage("File size must be 300 MB or less.");

        RuleForEach(x => x.Files)
            .Must(file => file == null || file.Length <= MaxFileSizeBytes)
            .WithMessage("Each file size must be 300 MB or less.");
    }
}
