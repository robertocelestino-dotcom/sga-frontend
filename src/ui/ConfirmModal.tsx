// src/components/ui/ConfirmModal.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button
} from '@mui/material';

interface ConfirmModalProps {
  open: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  corConfirmar?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  corConfirmar = 'error',
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {titulo}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {mensagem}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {textoCancelar}
        </Button>
        <Button onClick={onConfirm} color={corConfirmar} variant="contained" autoFocus>
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;