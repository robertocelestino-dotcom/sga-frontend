// src/hooks/useConfirmModal.ts

import { useState } from 'react';

interface ConfirmModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
}

export const useConfirmModal = () => {
    const [config, setConfig] = useState<ConfirmModalConfig>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning'
    });

    const openModal = (
        title: string,
        message: string,
        onConfirm: () => void,
        options?: Partial<Omit<ConfirmModalConfig, 'isOpen' | 'title' | 'message' | 'onConfirm'>>
    ) => {
        setConfig({
            isOpen: true,
            title,
            message,
            onConfirm,
            confirmText: options?.confirmText || 'Confirmar',
            cancelText: options?.cancelText || 'Cancelar',
            type: options?.type || 'warning',
            onCancel: options?.onCancel
        });
    };

    const closeModal = () => {
        setConfig(prev => ({ ...prev, isOpen: false }));
        if (config.onCancel) {
            config.onCancel();
        }
    };

    const handleConfirm = () => {
        config.onConfirm();
        closeModal();
    };

    return {
        modalConfig: config,
        openModal,
        closeModal,
        handleConfirm
    };
};