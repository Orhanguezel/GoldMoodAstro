'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'] });

import { useCreateContactPublicMutation } from '@/integrations/rtk/hooks';
import type { ContactCreatePayload } from '@/integrations/shared';
import { safeStr, isValidEmail} from '@/integrations/shared';

import { localizePath } from '@/integrations/shared';

type ContactFormTranslations = {
  formTitle: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  messagePh: string;
  topicLabel: string;
  topicAppointment: string;
  topicQuestion: string;
  topicCollab: string;
  topicOther: string;
  termsPrefix: string;
  terms: string;
  conditions: string;
  submit: string;
  sending: string;
  success: string;
  errorGeneric: string;
  errRequired: string;
  errEmail: string;
  errPhone: string;
  errMinMessage: string;
  subjectBase: string;
};

export type { ContactFormTranslations };

type Props = {
  locale: string;
  t: ContactFormTranslations;
};

type TopicKey = 'appointment' | 'question' | 'collab' | 'other';

const TOPIC_MAP: Record<TopicKey, keyof ContactFormTranslations> = {
  appointment: 'topicAppointment',
  question: 'topicQuestion',
  collab: 'topicCollab',
  other: 'topicOther',
};

const INPUT_CLS =
  'w-full px-6 py-4 rounded-[1rem] border bg-(--gm-bg-deep)/50 text-(--gm-text) focus:ring-2 focus:ring-(--gm-gold)/20 focus:border-(--gm-gold)/50 transition-all outline-none font-serif';
const INPUT_ERR = 'border-(--gm-error)/50';
const INPUT_OK = 'border-(--gm-border-soft)';

export default function ContactForm({ locale, t }: Props) {
  const [createContact, { isLoading }] = useCreateContactPublicMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<TopicKey>('appointment');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const fullName = useMemo(() => {
    return [safeStr(firstName), safeStr(lastName)].filter(Boolean).join(' ');
  }, [firstName, lastName]);

  const topicLabel = useMemo(() => safeStr(t[TOPIC_MAP[topic]]), [topic, t]);

  const computedSubject = useMemo(() => {
    const s = safeStr(subject);
    if (s) return s;
    const base = safeStr(t.subjectBase) || 'Contact Message';
    return topicLabel ? `${base} — ${topicLabel}` : base;
  }, [subject, t.subjectBase, topicLabel]);

  const hasError = useCallback(
    (field: 'firstName' | 'phone' | 'email' | 'message' | 'agree') => {
      if (!touched[field]) return false;
      if (field === 'firstName') return fullName.length < 2;
      if (field === 'phone') return safeStr(phone).length < 5;
      if (field === 'email') return !isValidEmail(email);
      if (field === 'message') return safeStr(message).length < 10;
      if (field === 'agree') return !agree;
      return false;
    },
    [touched, fullName, phone, email, message, agree],
  );

  const formId = useId();
  const ids = {
    first: `${formId}-first`,
    last: `${formId}-last`,
    phone: `${formId}-phone`,
    email: `${formId}-email`,
    topic: `${formId}-topic`,
    subject: `${formId}-subject`,
    msg: `${formId}-msg`,
    agree: `${formId}-agree`,
  };

  const privacyHref = useMemo(() => localizePath(locale, '/privacy-policy'), [locale]);
  const termsHref = useMemo(() => localizePath(locale, '/terms'), [locale]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, phone: true, email: true, message: true, agree: true });

    if (
      fullName.length < 2 ||
      safeStr(phone).length < 5 ||
      !isValidEmail(email) ||
      safeStr(message).length < 10 ||
      !agree
    ) {
      return;
    }

    const payload: ContactCreatePayload = {
      name: fullName,
      email: safeStr(email),
      phone: safeStr(phone),
      subject: computedSubject,
      message: safeStr(message),
      website: '',
    };

    try {
      await createContact(payload).unwrap();
      toast.success(t.success || 'Sent');
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setTopic('appointment');
      setSubject('');
      setMessage('');
      setAgree(false);
      setTouched({});
    } catch (err) {
      console.error('createContact error', err);
      toast.error(t.errorGeneric || 'Failed');
    }
  };

  const inputCls = (field?: 'firstName' | 'phone' | 'email' | 'message') =>
    `${INPUT_CLS} ${field && hasError(field) ? INPUT_ERR : INPUT_OK}`;

  return (
    <div className="bg-(--gm-surface) shadow-(--gm-shadow-card) border border-(--gm-border-soft) p-10 md:p-16 rounded-[3rem] relative overflow-hidden">
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-(--gm-gold)/5 rounded-full blur-3xl pointer-events-none" />
      
      <h3 className={`${cinzel.className} text-3xl text-(--gm-text) mb-12 relative`}>{t.formTitle}</h3>

      <form onSubmit={onSubmit} noValidate className="space-y-8 relative">
        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" name="website" />
          </label>
        </div>

        {/* Ad / Soyad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.first}>
              {t.firstName}
            </label>
            <input
              id={ids.first}
              className={inputCls('firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => touch('firstName')}
              autoComplete="given-name"
            />
            {hasError('firstName') && (
              <p className="text-xs mt-2 text-(--gm-error) ml-4">{t.errRequired}</p>
            )}
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.last}>
              {t.lastName}
            </label>
            <input
              id={ids.last}
              className={`${INPUT_CLS} ${INPUT_OK}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Email / Tel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.email}>
              {t.email}
            </label>
            <input
              id={ids.email}
              type="email"
              className={inputCls('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              autoComplete="email"
            />
            {hasError('email') && (
              <p className="text-xs mt-2 text-(--gm-error) ml-4">{t.errEmail}</p>
            )}
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.phone}>
              {t.phone}
            </label>
            <input
              id={ids.phone}
              className={inputCls('phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              autoComplete="tel"
            />
            {hasError('phone') && (
              <p className="text-xs mt-2 text-(--gm-error) ml-4">{t.errPhone}</p>
            )}
          </div>
        </div>

        {/* Konu / Başlık */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.topic}>
              {t.topicLabel}
            </label>
            <div className="relative">
              <select
                id={ids.topic}
                className={`${INPUT_CLS} ${INPUT_OK} appearance-none cursor-pointer`}
                value={topic}
                onChange={(e) => setTopic(e.target.value as TopicKey)}
              >
                <option value="appointment">{t.topicAppointment}</option>
                <option value="question">{t.topicQuestion}</option>
                <option value="collab">{t.topicCollab}</option>
                <option value="other">{t.topicOther}</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-(--gm-gold)">
                ▼
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.subject}>
              {t.subject}
            </label>
            <input
              id={ids.subject}
              className={`${INPUT_CLS} ${INPUT_OK}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={computedSubject}
            />
          </div>
        </div>

        {/* Mesaj */}
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-(--gm-muted) uppercase tracking-[0.3em] ml-4" htmlFor={ids.msg}>
            {t.message}
          </label>
          <textarea
            id={ids.msg}
            className={`${inputCls('message')} min-h-[180px] resize-none`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => touch('message')}
            placeholder={t.messagePh}
          />
          {hasError('message') && (
            <p className="text-xs mt-2 text-(--gm-error) ml-4">{t.errMinMessage}</p>
          )}
        </div>

        {/* Onay */}
        <div className="pt-2">
          <label className="inline-flex items-start gap-4 text-sm text-(--gm-text-dim) cursor-pointer group" htmlFor={ids.agree}>
            <input
              id={ids.agree}
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-(--gm-border-soft) bg-(--gm-bg-deep) text-(--gm-gold) focus:ring-(--gm-gold)/20"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              onBlur={() => touch('agree')}
            />
            <span className="font-serif italic opacity-80 group-hover:opacity-100 transition-opacity">
              {t.termsPrefix}{' '}
              <a className="text-(--gm-gold) hover:underline font-bold" href={privacyHref}>
                {t.terms}
              </a>
              {t.conditions && (
                <>
                  {' / '}
                  <a className="text-(--gm-gold) hover:underline font-bold" href={termsHref}>
                    {t.conditions}
                  </a>
                </>
              )}
            </span>
          </label>
          {hasError('agree') && (
            <p className="text-xs mt-2 text-(--gm-error) ml-9">{t.errRequired}</p>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center w-full md:w-auto px-12 py-5 bg-(--gm-gold) text-(--gm-bg-deep) font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-(--gm-shadow-gold) rounded-full disabled:opacity-60"
          >
            {isLoading ? t.sending : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
