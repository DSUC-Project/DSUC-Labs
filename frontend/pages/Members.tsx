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
        whileHover={{ y: -5, x: -5 }}
        className="relative group cursor-pointer h-full brutal-card"
      >
        <div className="bg-white p-6 h-full flex flex-col items-center text-center">
           <div className={`w-24 h-24 shrink-0 relative mb-5 border-4 border-brutal-black transition-transform duration-300 group-hover:scale-110 shadow-neo-sm ${type === 'official' ? 'bg-brutal-yellow' : 'bg-brutal-blue'}`}>
            <img src={member.avatar || 'https://via.placeholder.com/150'} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
          </div>

          <div className="mb-5">
            <h3 className={`text-xl font-display font-black leading-tight flex-1 tracking-tight mb-2 uppercase group-hover:underline decoration-brutal-pink decoration-4 underline-offset-2 ${type === 'official' ? 'text-brutal-black' : 'text-brutal-black'}`}>{member.name}</h3>
            <p className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-brutal-black shadow-neo-sm inline-block ${type === 'official' ? 'bg-brutal-yellow' : 'bg-brutal-blue text-white'}`}>
              {type === 'community' ? 'Cộng đồng' : member.role || 'Thành viên'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6 w-full">
            {member.skills.slice(0, 3).map(skill => (
              <span key={skill} className="text-[10px] uppercase font-black tracking-wider px-2 py-1 bg-white border-2 border-brutal-black text-brutal-black transition-colors group-hover:bg-brutal-pink shadow-neo-sm">
                {skill}
              </span>
            ))}
          </div>

          <div className="flex gap-4 mt-auto border-t-4 border-brutal-black pt-4 w-full justify-center">
            {member.socials.github && <Github size={20} className="text-brutal-black hover:-translate-y-1 transition-transform" />}
            {member.socials.twitter && <Twitter size={20} className="text-brutal-black hover:-translate-y-1 transition-transform" />}
            {member.socials.telegram && <Send size={20} className="text-brutal-black hover:-translate-y-1 transition-transform" />}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
