import { whatsappService } from './service';

export const testWhatsAppIntegration = async () => {
  try {
    // Test sending a message using the query_received template
    const result = await whatsappService.sendTemplateMessage(
      process.env.VITE_ADMIN_PHONE_NUMBER!, // Using admin number for testing
      'query_received',
      ['Test Customer', 'TEST-001'] // Sample variables for the template
    );
    
    console.log('WhatsApp test message sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('WhatsApp test failed:', error);
    return { success: false, error };
  }
};
