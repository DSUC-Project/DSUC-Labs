import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Twitter, Send, Users } from 'lucide-react';
import { useStore } from '../store/useStore'; // Use store for Members
import { Member } from '../types';

export function Members() {
  const { members } = useStore(); // Get members from store
  const officialMembers = members.filter(
    (member) => member.memberType !== 'community'
  );
  const communityMembers = members.filter(
    (member) => member.memberType === 'community'
  );

  return (
    <div className="space-y-12 pb-20 pt-10 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-brutal-black pb-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-display font-black mb-4 text-brutal-black uppercase tracking-tighter decoration-brutal-yellow decoration-4 underline underline-offset-4">THÀNH VIÊN</h2>
          <p className="text-brutal-black font-bold border-l-4 border-brutal-pink pl-4">Những cá nhân xuất sắc đang đóng góp vào mạng lưới DSUC.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brutal-blue border-4 border-brutal-black text-brutal-black font-black text-xs uppercase tracking-widest shadow-neo-sm">
          <Users size={20} />
          {members.length} người dùng
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-4 border-brutal-black bg-brutal-yellow p-4 shadow-neo">
          <h3 className="text-2xl font-display font-black text-brutal-black uppercase">
            Thành viên chính thức
          </h3>
          <span className="px-3 py-1 bg-white border-4 border-brutal-black text-brutal-black text-xs font-black uppercase tracking-widest shadow-neo-sm">
            {officialMembers.length} thành viên
          </span>
        </div>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {officialMembers.map((member) => (
            <MemberCard key={member.id} member={member} type="official" />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-4 border-brutal-black bg-brutal-pink p-4 shadow-neo">
          <h3 className="text-2xl font-display font-black text-brutal-black uppercase">
            Cộng đồng
          </h3>
          <span className="px-3 py-1 bg-white border-4 border-brutal-black text-brutal-black text-xs font-black uppercase tracking-widest shadow-neo-sm">
            {communityMembers.length} học viên
          </span>
        </div>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {communityMembers.map((member) => (
            <MemberCard key={member.id} member={member} type="community" />
          ))}
          {communityMembers.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm font-black uppercase tracking-widest text-brutal-black bg-white border-4 border-brutal-black shadow-neo">
              Chưa có thành viên cộng đồng nào
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MemberCard({ member, type }: { member: Member; type: 'official' | 'community'; key?: React.Key }) {
  return (
    <Link to={`/member/${member.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -3, x: -3 }}
        className="relative group cursor-pointer h-full brutal-card"
      >
        <div className="flex h-full flex-col items-center bg-white p-4 text-center">
           <div className={`relative mb-4 h-20 w-20 shrink-0 border-4 border-brutal-black shadow-neo-sm transition-transform duration-300 group-hover:scale-105 ${type === 'official' ? 'bg-brutal-yellow' : 'bg-brutal-blue'}`}>
            <img src={member.avatar || 'https://via.placeholder.com/150'} alt={member.name} className="h-full w-full object-cover" />
          </div>

          <div className="mb-4 min-h-[96px] w-full">
            <h3 className="mb-2 line-clamp-2 min-h-[56px] text-lg font-display font-black uppercase leading-tight tracking-tight text-brutal-black">
              {member.name}
            </h3>
            <p className={`inline-block border-2 border-brutal-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-neo-sm ${type === 'official' ? 'bg-brutal-yellow' : 'bg-brutal-blue text-white'}`}>
              {type === 'community' ? 'Cộng đồng' : member.role || 'Thành viên'}
            </p>
          </div>

          <div className="mb-4 flex min-h-[64px] w-full flex-wrap justify-center gap-2">
            {member.skills.slice(0, 2).map(skill => (
              <span key={skill} className="border-2 border-brutal-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brutal-black shadow-neo-sm transition-colors group-hover:bg-brutal-pink">
                {skill}
              </span>
            ))}
            {member.skills.length === 0 && (
              <span className="border-2 border-brutal-black bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 shadow-neo-sm">
                Chưa thêm kỹ năng
              </span>
            )}
          </div>

          <div className="mt-auto flex w-full justify-center gap-4 border-t-4 border-brutal-black pt-3">
            {member.socials.github && <Github size={18} className="text-brutal-black transition-transform hover:-translate-y-1" />}
            {member.socials.twitter && <Twitter size={18} className="text-brutal-black transition-transform hover:-translate-y-1" />}
            {member.socials.telegram && <Send size={18} className="text-brutal-black transition-transform hover:-translate-y-1" />}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
