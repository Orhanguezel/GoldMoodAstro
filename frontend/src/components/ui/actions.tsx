// =============================================================
// FILE: src/components/ui/actions.tsx
// goldmoodastro – Satır İşlem Butonları (Düzenle / Sil)
// =============================================================

'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiSection } from '@/i18n';

export type ActionsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean; // mobilde daha sıkı layout
  disableDelete?: boolean;
};

const Actions: React.FC<ActionsProps> = ({
  onEdit,
  onDelete,
  compact = false,
  disableDelete = false,
}) => {
  const { ui } = useUiSection('ui_misc' as any);

  // Hiç action yoksa hiçbir şey render etme
  if (!onEdit && !onDelete) return null;

  const sizeClass = compact ? 'btn-sm' : 'btn-sm';

  return (
    <div className="d-flex gap-1 justify-content-end">
      {onEdit && (
        <Button
          type="button"
          variant="outline"
          className={sizeClass + ' d-inline-flex align-items-center gap-1'}
          onClick={onEdit}
        >
          <Pencil size={14} />
          <span className="d-none d-sm-inline">{ui('ui_misc_edit', 'Düzenle')}</span>
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="destructive"
          className={sizeClass + ' d-inline-flex align-items-center gap-1'}
          onClick={onDelete}
          disabled={disableDelete}
        >
          <Trash2 size={14} />
          <span className="d-none d-sm-inline">{ui('ui_misc_delete', 'Sil')}</span>
        </Button>
      )}
    </div>
  );
};

export default Actions;
