'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ReviewForm from './ReviewForm';
import { useUiSection } from '@/i18n';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'consultant';
  consultantName: string;
  locale: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  consultantName,
  locale,
}: ReviewModalProps) {
  const { ui } = useUiSection('ui_extra' as any);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-(--gm-surface) border-(--gm-border-soft) text-(--gm-text)">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {ui('ui_extra_b2_review_modal_title', 'Review {name}').replace('{name}', consultantName)}
          </DialogTitle>
          <DialogDescription className="text-(--gm-text-dim)">
            {ui('ui_extra_b2_review_modal_desc', 'Share your experience and help other users.')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <ReviewForm
            targetType={targetType}
            targetId={targetId}
            locale={locale}
            showToggle={false}
            initialOpen={true}
            onSubmitted={() => onClose()}
            className="!p-0 !bg-transparent"
            titleOverride=" "
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
