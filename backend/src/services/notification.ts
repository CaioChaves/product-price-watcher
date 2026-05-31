import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface AlertNotificationPayload {
  productName: string;
  url: string;
  oldPriceEur: number;
  newPriceEur: number;
  dropPercent: number;
  dropAmount: number;
}

export class NotificationService {
  /**
   * Main dispatch method
   */
  static async sendWhatsAppAlert(payload: AlertNotificationPayload): Promise<boolean> {
    const message = this.formatAlertMessage(payload);

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_WHATSAPP || 'whatsapp:+14155238886';
    const to = process.env.TWILIO_TO_WHATSAPP;

    if (sid && token && to) {
      return this.sendTwilioWhatsApp(sid, token, from, to, message);
    } else {
      this.logSimulatedWhatsApp(to || 'UNCONFIGURED_NUMBER', message);
      return true; // Return success for simulation mode
    }
  }

  /**
   * Format a nice notification message
   */
  private static formatAlertMessage(payload: AlertNotificationPayload): string {
    const percentStr = (payload.dropPercent * 100).toFixed(0);
    return `🚨 *Discount Alert!* 🚨\n\n` +
           `The price of *${payload.productName}* has dropped!\n\n` +
           `📉 *Discount:* -${percentStr}% (-€${payload.dropAmount.toFixed(2)})\n` +
           `💰 *Old Price:* €${payload.oldPriceEur.toFixed(2)}\n` +
           `🏷️ *New Price:* €${payload.newPriceEur.toFixed(2)} (stored in EUR)\n\n` +
           `🔗 *Product Link:* ${payload.url}\n\n` +
           `_Acknowledge or reset this alert on your dashboard to receive future notifications._`;
  }

  /**
   * Send WhatsApp via Twilio REST API directly
   */
  private static async sendTwilioWhatsApp(
    sid: string,
    token: string,
    from: string,
    to: string,
    body: string
  ): Promise<boolean> {
    console.log(`Sending real WhatsApp message via Twilio to ${to}...`);
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`);
      params.append('To', to.startsWith('whatsapp:') ? to : `whatsapp:${to}`);
      params.append('Body', body);

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.status === 201 || response.status === 200) {
        console.log(`✔ WhatsApp notification successfully sent via Twilio! SID: ${response.data.sid}`);
        return true;
      }
      throw new Error(`Unexpected Twilio response status: ${response.status}`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      console.error(`❌ Failed to send Twilio WhatsApp notification: ${errMsg}`);
      return false;
    }
  }

  /**
   * Log simulated WhatsApp message in console
   */
  private static logSimulatedWhatsApp(to: string, message: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`📱 [SIMULATED WHATSAPP NOTIFICATION FOR: ${to}]`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60) + '\n');
  }
}
