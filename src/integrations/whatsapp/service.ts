import axios from 'axios';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  version: string;
}

export class WhatsAppService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: WhatsAppConfig) {
    this.baseUrl = `https://graph.facebook.com/${config.version}/${config.phoneNumberId}`;
    this.headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: string[]
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en'
            },
            components: [
              {
                type: 'body',
                parameters: variables.map(text => ({
                  type: 'text',
                  text
                }))
              }
            ]
          }
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }
}

// Create WhatsApp service instance
export const whatsappService = new WhatsAppService({
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
  version: 'v17.0'
});
