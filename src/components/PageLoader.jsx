import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PageLoader({ text = 'Loading SuccessX Data...' }) {
  return (
    <div className="page-loader-shell py-5 my-4">
      <div className="page-loader-orb">
        <div className="page-loader-ring ring-a"></div>
        <div className="page-loader-ring ring-b"></div>
        <div className="page-loader-core">
          <Sparkles size={24} />
        </div>
      </div>

      <span className="page-loader-text">{text}</span>
    </div>
  );
}
