export function campaign({ url, source, medium, campaign, phone, message }) {
  if (![url, source, medium, campaign, phone, message].every((x) => typeof x === 'string'))
    throw Error('Preencha os campos da campanha.');
  const dest = new URL(url);
  if (!['https:', 'http:'].includes(dest.protocol) || dest.username || dest.password)
    throw Error('Use um endereço http/https sem senha.');
  if (!source.trim() || !medium.trim() || !campaign.trim()) throw Error('Origem, mídia e campanha são obrigatórias.');
  if ([source, medium, campaign].some((x) => x.length > 120) || message.length > 2000)
    throw Error('Campanha ou mensagem excede o limite.');
  dest.searchParams.set('utm_source', source.trim());
  dest.searchParams.set('utm_medium', medium.trim());
  dest.searchParams.set('utm_campaign', campaign.trim());
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  if (!/^55[1-9][0-9](?:9[0-9]{8}|[2-5][0-9]{7})$/.test(digits))
    throw Error('Informe um telefone brasileiro válido com DDD.');
  const whatsapp = new URL('https://wa.me/' + digits);
  whatsapp.searchParams.set('text', message);
  return { landing: dest.href, whatsapp: whatsapp.href, phone: digits, campaign: campaign.trim() };
}
export async function process(input) {
  const bundle = campaign(input);
  return {
    text: JSON.stringify(bundle, null, 2),
    filename: 'campanha-biziva.json',
    mime: 'application/json',
    summary: 'Link rastreável + WhatsApp prontos. Nenhuma mensagem foi enviada.',
  };
}
