import React from 'react';

export const VLibrasButton: React.FC = () => {
  return (
    <aside
      aria-label="Acessibilidade VLibras"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center shadow-lg rounded-l-lg bg-[#1867c0] hover:bg-[#12539c] text-white p-2.5 transition-all duration-200 cursor-pointer group"
      title="Acessibilidade em Libras"
    >
      <div className="flex flex-col items-center">
        {/* Ícone estilizado de mãos em Libras */}
        <svg
          className="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10.05 4.75a1.25 1.25 0 0 1 2.5 0v5.5a.75.75 0 0 0 1.5 0V6a1.25 1.25 0 0 1 2.5 0v4.25a.75.75 0 0 0 1.5 0v-2a1.25 1.25 0 0 1 2.5 0v6.1c0 3.75-3.05 6.65-6.8 6.65-3.5 0-6.4-2.7-6.75-6.2l-.4-4.2a1.25 1.25 0 0 1 2.45-.4l.25 2.55a.75.75 0 0 0 1.5-.15V4.75z" />
        </svg>
        <span className="text-[10px] font-bold mt-0.5 tracking-tighter">VLibras</span>
      </div>
    </aside>
  );
};
