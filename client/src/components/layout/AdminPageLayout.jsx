import React from "react";

const AdminPageLayout = ({ title, subtitle, actions, children }) => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
  {children}
    </div>
  );
};

export default AdminPageLayout;
