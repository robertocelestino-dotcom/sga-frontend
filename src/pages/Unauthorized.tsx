// ============================================================
//                    UNAUTHORIZED PAGE
// ============================================================

// pages/Unauthorized.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                <p className="text-gray-600 mb-6">
                    Você não tem permissão para acessar esta página.
                </p>
                <Link
                    to="/dashboard"
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
