/** Contato comercial da página pública (D-38): WhatsApp com mensagem já escrita. */
export const WHATSAPP = "5541987232750";

export const MENSAGEM_PADRAO = "Olá! Vi o site do Jornada e quero entender o impacto do fim da escala 6x1 na minha empresa.";

export const linkWhatsApp = (mensagem: string = MENSAGEM_PADRAO) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
