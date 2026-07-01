'use client';

import React, { useState } from 'react';
import { 
  useListPendingKycAdminQuery, 
  useApproveKycAdminMutation, 
  useRejectKycAdminMutation,
  type KycConsultantAdmin
} from '@/integrations/endpoints/admin/kyc_admin.endpoints';
import { toast } from 'sonner';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function KycAdminPage() {
  const t = useAdminT('admin.withdrawals');
  const { data: pendingKyc = [], isLoading } = useListPendingKycAdminQuery();
  const [approve, { isLoading: isApproving }] = useApproveKycAdminMutation();
  const [reject, { isLoading: isRejecting }] = useRejectKycAdminMutation();
  
  const [selectedConsultant, setSelectedConsultant] = useState<KycConsultantAdmin | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    if (!confirm(t('kyc.confirmApprove', undefined, 'Bu danışmanın KYC belgelerini onaylamak istediğinize emin misiniz?'))) return;
    try {
      await approve(id).unwrap();
      toast.success(t('kyc.approveSuccess', undefined, 'KYC başarıyla onaylandı.'));
      setSelectedConsultant(null);
    } catch {
      toast.error(t('kyc.approveError', undefined, 'Onaylama sırasında bir hata oluştu.'));
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) {
      toast.error(t('kyc.reasonRequired', undefined, 'Lütfen bir ret sebebi giriniz.'));
      return;
    }
    if (!confirm(t('kyc.confirmReject', undefined, 'KYC başvurusunu reddetmek istediğinize emin misiniz?'))) return;
    try {
      await reject({ id, reason: rejectReason }).unwrap();
      toast.success(t('kyc.rejectSuccess', undefined, 'KYC reddedildi.'));
      setSelectedConsultant(null);
      setRejectReason('');
    } catch {
      toast.error(t('kyc.rejectError', undefined, 'Ret işlemi sırasında bir hata oluştu.'));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('kyc.pageTitle', undefined, 'KYC Onay Bekleyen Danışmanlar')}</h1>

      {isLoading ? (
        <div>{t('state.loading', undefined, 'Yükleniyor...')}</div>
      ) : pendingKyc.length === 0 ? (
        <div className="text-gray-500">{t('kyc.empty', undefined, 'Bekleyen KYC başvurusu bulunmuyor.')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {pendingKyc.map(consultant => (
              <div 
                key={consultant.id} 
                className={`p-4 border rounded-xl cursor-pointer hover:border-blue-500 transition-colors ${selectedConsultant?.id === consultant.id ? 'border-blue-500 bg-blue-50/50' : 'bg-white'}`}
                onClick={() => setSelectedConsultant(consultant)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{consultant.full_name || t('kyc.unnamed', undefined, 'İsimsiz')}</h3>
                    <p className="text-sm text-gray-500">{consultant.email}</p>
                    <div className="mt-2 text-xs font-semibold px-2 py-1 bg-gray-100 rounded-full inline-block">
                      {consultant.account_type === 'company' ? t('kyc.company', undefined, 'Şirket') : t('kyc.individual', undefined, 'Bireysel')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    ID: {consultant.id.split('-')[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedConsultant && (
            <div className="p-6 border rounded-xl bg-white sticky top-6">
              <h2 className="text-xl font-bold mb-4">{t('kyc.details', undefined, 'Detaylar')}</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500">{t('kyc.accountType', undefined, 'Hesap Tipi')}</span>
                    <span className="font-medium">{selectedConsultant.account_type === 'company' ? t('kyc.company', undefined, 'Şirket') : t('kyc.individual', undefined, 'Bireysel')}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">{t('kyc.billingAddress', undefined, 'Fatura Adresi')}</span>
                    <span className="font-medium">{selectedConsultant.billing_address || '-'}</span>
                  </div>

                  {selectedConsultant.account_type === 'individual' ? (
                    <>
                      <div>
                        <span className="block text-gray-500">{t('kyc.identityNumber', undefined, 'TC Kimlik No')}</span>
                        <span className="font-medium">{selectedConsultant.identity_number || '-'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-gray-500">{t('kyc.companyName', undefined, 'Şirket Unvanı')}</span>
                        <span className="font-medium">{selectedConsultant.company_name || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">{t('kyc.taxOffice', undefined, 'Vergi Dairesi')}</span>
                        <span className="font-medium">{selectedConsultant.tax_office || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">{t('kyc.taxNumber', undefined, 'Vergi No')}</span>
                        <span className="font-medium">{selectedConsultant.tax_number || '-'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-bold mb-2">{t('kyc.uploadedDocuments', undefined, 'Yüklenen Belgeler')}</h3>
                  {selectedConsultant.kyc_documents && selectedConsultant.kyc_documents.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {selectedConsultant.kyc_documents.map((doc, i) => (
                        <div key={i} className="min-w-[150px]">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block p-2 border rounded-lg hover:bg-gray-50 text-center text-sm text-blue-600">
                            {t('kyc.viewDocument', { type: doc.type }, '{type} Görüntüle')}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">{t('kyc.noDocuments', undefined, 'Belge yüklenmemiş.')}</div>
                  )}
                </div>

                <div className="pt-6 border-t flex flex-col gap-3">
                  <button 
                    onClick={() => handleApprove(selectedConsultant.id)}
                    disabled={isApproving || isRejecting}
                    className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                  >
                    {isApproving ? t('kyc.approving', undefined, 'Onaylanıyor...') : t('actions.approve', undefined, 'Onayla')}
                  </button>

                  <div className="mt-4 p-4 border border-red-100 rounded-lg bg-red-50">
                    <h4 className="font-bold text-red-800 text-sm mb-2">{t('actions.reject', undefined, 'Reddet')}</h4>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder={t('kyc.rejectPlaceholder', undefined, 'Reddetme sebebini yazın (Danışmana email ile gidecek)')}
                      className="w-full p-2 border rounded text-sm mb-2"
                      rows={3}
                    />
                    <button
                      onClick={() => handleReject(selectedConsultant.id)}
                      disabled={isApproving || isRejecting || !rejectReason}
                      className="w-full py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                      {isRejecting ? t('kyc.rejecting', undefined, 'Reddediliyor...') : t('kyc.rejectAndNotify', undefined, 'Reddet ve Bildir')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
