using AutoMapper;
using Project.Application.DTOs.Admin;
using Project.Application.DTOs.Reports;
using Project.Core.Entities;

namespace Project.Application.Mappings;

public sealed class ApplicationMappingProfile : Profile
{
    public ApplicationMappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<ReportAttachment, ReportAttachmentDto>();
    }
}
