import { Member, Event, Bounty, Repo, Resource, Project, Bank } from "../types";

// Re-export skills from the comprehensive library
export { AVAILABLE_SKILLS } from './skillsLibrary';

export const ROLES: string[] = [
    'President',
    'Vice-President',
    'Tech-Lead',
    'Media-Lead',
    'Member'
];

export const BANKS: Bank[] = [
    { id: '970415', name: 'Ngân hàng TMCP Công thương Việt Nam', code: 'ICB', bin: '970415', shortName: 'VietinBank', logo: '' },
    { id: '970436', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: '' },
    { id: '970418', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', code: 'BIDV', bin: '970418', shortName: 'BIDV', logo: '' },
    { id: '970405', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', code: 'VBA', bin: '970405', shortName: 'Agribank', logo: '' },
    { id: '970422', name: 'Ngân hàng TMCP Quân đội', code: 'MB', bin: '970422', shortName: 'MBBank', logo: '' },
    { id: '970407', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: '' },
    { id: '970416', name: 'Ngân hàng TMCP Á Châu', code: 'ACB', bin: '970416', shortName: 'ACB', logo: '' },
    { id: '970432', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', bin: '970432', shortName: 'VPBank', logo: '' },
    { id: '970423', name: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', bin: '970423', shortName: 'TPBank', logo: '' },
    { id: '970403', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', bin: '970403', shortName: 'Sacombank', logo: '' },
    { id: '970437', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', code: 'HDB', bin: '970437', shortName: 'HDBank', logo: '' },
    { id: '970441', name: 'Ngân hàng TMCP Quốc tế Việt Nam', code: 'VIB', bin: '970441', shortName: 'VIB', logo: '' },
    { id: '970443', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB', bin: '970443', shortName: 'SHB', logo: '' },
    { id: '970448', name: 'Ngân hàng TMCP Phương Đông', code: 'OCB', bin: '970448', shortName: 'OCB', logo: '' },
    { id: '970431', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', code: 'EIB', bin: '970431', shortName: 'Eximbank', logo: '' },
    { id: '970426', name: 'Ngân hàng TMCP Hàng Hải Việt Nam', code: 'MSB', bin: '970426', shortName: 'MSB', logo: '' },
    { id: '970440', name: 'Ngân hàng TMCP Đông Nam Á', code: 'SEAB', bin: '970440', shortName: 'SeABank', logo: '' },
    { id: '970449', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', code: 'LPB', bin: '970449', shortName: 'LPBank', logo: '' },
    { id: '970438', name: 'Ngân hàng TMCP Bưu điện Liên Việt', code: 'LPB', bin: '970438', shortName: 'LienVietPostBank', logo: '' },
    { id: '970400', name: 'Ngân hàng TMCP Sài Gòn Công Thương', code: 'SGICB', bin: '970400', shortName: 'SaigonBank', logo: '' },
    { id: '970419', name: 'Ngân hàng TMCP Quốc Dân', code: 'NCB', bin: '970419', shortName: 'NCB', logo: '' },
    { id: '970428', name: 'Ngân hàng TMCP Nam Á', code: 'NAB', bin: '970428', shortName: 'Nam A Bank', logo: '' },
    { id: '970412', name: 'Ngân hàng TMCP Đại Chúng Việt Nam', code: 'PVCB', bin: '970412', shortName: 'PVcomBank', logo: '' },
    { id: '970454', name: 'Ngân hàng TMCP Bản Việt', code: 'VCCB', bin: '970454', shortName: 'VietCapitalBank', logo: '' },
    { id: '546034', name: 'Ngân hàng số CAKE by VPBank', code: 'CAKE', bin: '546034', shortName: 'CAKE', logo: '' },
    { id: '546035', name: 'Ngân hàng số Ubank by VPBank', code: 'Ubank', bin: '546035', shortName: 'Ubank', logo: '' },
];

export const MEMBERS: Member[] = [];
export const EVENTS: Event[] = [];
export const PROJECTS: Project[] = [];
export const BOUNTIES: Bounty[] = [];
export const REPOS: Repo[] = [];
export const RESOURCES: Resource[] = [];

export default {};

// IMPORTANT: Mock database is in backend/src/mockDb.ts
