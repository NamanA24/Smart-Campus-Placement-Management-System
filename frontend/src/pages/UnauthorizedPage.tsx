import React from 'react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold font-sora mb-4">403</h1>
        <p className="text-2xl mb-8">Access Denied</p>
        <p className="text-red-100 mb-8">You don't have permission to access this resource.</p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-white text-red-900 font-semibold rounded-lg hover:bg-red-100 transition"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};
