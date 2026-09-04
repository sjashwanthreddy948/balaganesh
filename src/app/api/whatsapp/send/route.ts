import { NextRequest, NextResponse } from 'next/server';
import { normalizeIndianMobileForWhatsApp } from '@/lib/validation';
import { buildWhatsAppCertificateMessage } from '@/config/festival.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      certificateNumber,
      mobileNumber,
      fullName,
      amount,
      paymentMethod,
      certificateImageUrl,
    } = body;

    // Validate mobile number
    const normalizedPhone = normalizeIndianMobileForWhatsApp(mobileNumber);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid mobile number is required to send the certificate via WhatsApp.',
        },
        { status: 400 }
      );
    }

    // Check WhatsApp Business Cloud API credentials
    const token =
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_BUSINESS_TOKEN ||
      process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return NextResponse.json({
        success: false,
        apiConfigured: false,
        message:
          'WhatsApp Business Cloud API is not configured yet in server environment settings.',
        targetPhone: normalizedPhone.displayPhone,
        requiredConfiguration: {
          WHATSAPP_ACCESS_TOKEN: 'System User Permanent Access Token from Meta Business Manager',
          WHATSAPP_PHONE_NUMBER_ID: 'Phone Number ID from WhatsApp > API Setup in Meta App Dashboard',
          WHATSAPP_GROUP_INVITE_URL: 'Official WhatsApp Group Invite Link (defaults to configured festival group)',
          WHATSAPP_TEMPLATE_NAME: 'Optional: Pre-approved message template with URL CTA button',
        },
      });
    }

    const groupUrl =
      process.env.WHATSAPP_GROUP_INVITE_URL ||
      process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK ||
      'https://chat.whatsapp.com/GNkn8pSUWtj9YWa9DInE8j';

    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

    const messageText = buildWhatsAppCertificateMessage({
      fullName: fullName || 'Devotee',
      amount: Number(amount) || 0,
      paymentMethod: paymentMethod || 'ONLINE',
      certificateNumber: certificateNumber || 'BG2026',
    });

    let payload: any;

    if (templateName) {
      // 1. Approved Message Template with URL CTA Button
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.whatsappPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [
            ...(certificateImageUrl && certificateImageUrl.startsWith('http')
              ? [
                  {
                    type: 'header',
                    parameters: [
                      {
                        type: 'image',
                        image: { link: certificateImageUrl },
                      },
                    ],
                  },
                ]
              : []),
            {
              type: 'body',
              parameters: [
                { type: 'text', text: fullName || 'Devotee' },
                { type: 'text', text: Number(amount || 0).toLocaleString('en-IN') },
                { type: 'text', text: certificateNumber || 'BG2026' },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: '' },
              ],
            },
          ],
        },
      };
    } else {
      // 2. Interactive CTA URL Message with Certificate Image Header & Native "VIEW GROUP" Button
      const bodyText = `Namaste ${fullName || 'Devotee'} 🙏\n\nThank you for your valuable contribution of ₹${Number(amount || 0).toLocaleString('en-IN')}\nto Bala Ganesh Association – Ganesh Festival 2026.\n\nCertificate No: ${certificateNumber || 'BG2026'}\n\nWe sincerely appreciate your support.\n\nJoin our Ganesh Festival WhatsApp Group for updates.`;

      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.whatsappPhone,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          ...(certificateImageUrl && certificateImageUrl.startsWith('http')
            ? {
                header: {
                  type: 'image',
                  image: { link: certificateImageUrl },
                },
              }
            : {}),
          body: {
            text: bodyText,
          },
          footer: {
            text: 'Ganpati Bappa Morya! 🙏 — BALA GANESH ASSOCIATION',
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: 'VIEW GROUP',
              url: groupUrl,
            },
          },
        },
      };
    }

    // Try sending interactive/template message
    let metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    let metaJson = await metaRes.json();

    // If interactive format fails (e.g. 24h window restriction or account tier), fallback to image media message
    if (!metaRes.ok && certificateImageUrl && certificateImageUrl.startsWith('http')) {
      console.warn('Interactive message failed, trying media image message with caption:', metaJson);
      const fallbackPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.whatsappPhone,
        type: 'image',
        image: {
          link: certificateImageUrl,
          caption: messageText,
        },
      };

      metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackPayload),
        }
      );
      metaJson = await metaRes.json();
    }

    if (!metaRes.ok || metaJson.error) {
      console.error('Meta WhatsApp API error:', metaJson);
      return NextResponse.json({
        success: false,
        apiConfigured: true,
        error: metaJson.error?.message || 'Failed to send WhatsApp message via Meta Cloud API',
        details: metaJson.error,
      });
    }

    return NextResponse.json({
      success: true,
      apiConfigured: true,
      message: `Certificate and VIEW GROUP button sent successfully via WhatsApp to ${normalizedPhone.displayPhone}`,
      messageId: metaJson.messages?.[0]?.id,
    });
  } catch (error: any) {
    console.error('WhatsApp API endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
