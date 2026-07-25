import Client from './_components/google-ads-client';

// Ekosistem pazarlama/analitik modulu — sosial.tarvista.com backend'ine baglanir.
// .ui-v2-shell: ported bilesenlerin (light Tailwind class'lari) dark ekosistem
// temasina remap edilmesi icin gerekli wrapper.
export default function Page() {
  return (
    <div className="ui-v2-shell min-h-screen">
      <Client />
    </div>
  );
}
