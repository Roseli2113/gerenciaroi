const FALLBACK_SUPABASE_URL = 'https://zwylxoajyyjflvvcwpvz.supabase.co';

export const PLATFORMS_WITH_WEBHOOK_URL = [
  'Lowify', 'AdsRoi', 'Logzz', 'BuyGoods',
  'Hotmart', 'Kiwify', 'Eduzz', 'Braip', 'Monetizze', 'PerfectPay', 'Ticto', 'Hubla',
  'Shopify', 'Woocommerce', 'NuvemShop', 'Yampi',
  'Clickbank', 'Digistore', 'Maxweb',
  'Cartpanda', 'Vega 1', 'Kirvano', 'Lastlink', 'Payt', 'Adoorei', 'TriboPay', 'Paradise',
  'Pepper', 'MundPay', 'Disrupty', 'Greenn', 'Guru', 'Doppus', 'Frendz', 'InvictusPay',
  'Appmax', 'NitroPagamentos', 'GoatPay', 'Hebreus', 'IExperience', 'PagTrust',
  'FortPay', 'Systeme', 'IronPay', 'CinqPay', 'SharkPays', 'Zouti', 'Pantherfy',
  'StrivPay', 'AtomoPay', 'AllPay', 'BullPay', 'OctusPay', 'Zippify', 'Masterfy', 'InovaPag',
  'SoutPay', 'WolfPay', 'SigmaPagamentos', 'Nexopayt', 'WeGate', 'Unicornify', 'Allpes',
  'VittaPay', 'FluxionPay', 'NezzyPay', 'PMHMPay', 'TrivexPay', 'GatPay', 'BearPay',
  'AmandisPay', 'DigiPag', 'AlphaPay', 'AssetPay', 'BrGateway', 'Creedx', 'Hotfy',
  'KlivoPay', 'Plumify', 'PrimeGate', 'Wise2Pay', 'VisionPay', 'SharkBytePay', 'SigmaPay',
  'ZeroOnePay', 'Traxon', 'Bloo', 'KitePay', 'B4you', 'Risepay', 'Urus', 'Cakto',
  'Flashpay', 'DigitalMart', 'Exattus', 'LunarCash', 'YouShop', 'BlackPay', 'VenuzPay',
  'LunaCheckout', 'FullSale', 'BullsPay', 'Moodi', 'NikaPay', 'GhostsPay', 'KeedPay',
  'Salduu', 'ViperPay', 'Sunize', 'Assiny', 'Wiapy', 'UnicoPag', 'ImperialPay', 'Zedy',
  'Sinix', 'Voomp', 'Ombrelone', 'PushinPay', 'Genesys', 'OnProfit', 'SacaPay', 'Cloudfy',
  'Kuenha', 'NinjaPay', 'Xgrow', 'ggCheckout', 'PanteraCheckout', 'NublaPay', 'Cartly',
  'Pagah', 'Pagsafe', 'Nomadfy', 'Sync', 'LPQV',
];

export const platformRequiresWebhookUrl = (platform: string) =>
  PLATFORMS_WITH_WEBHOOK_URL.includes(platform);

export const buildWebhookUrl = (platform: string, token: string, event?: string) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const params = new URLSearchParams({
    platform: platform.toLowerCase(),
    token,
  });

  if (event) {
    params.set('event', event);
  }

  return `${baseUrl}/functions/v1/webhook-receiver?${params.toString()}`;
};