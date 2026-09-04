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
      });
    }

    const messageText = buildWhatsAppCertificateMessage({
      fullName: fullName || 'Devotee',
      amount: Number(amount) || 0,
      paymentMethod: paymentMethod || 'ONLINE',
      certificateNumber: certificateNumber || 'BG2026',
    });

    // Send via Meta Graph API
    let payload: any;
    if (certificateImageUrl && certificateImageUrl.startsWith('http')) {
      // Send image message with caption
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.whatsappPhone,
        type: 'image',
        image: {
          link: certificateImageUrl,
          caption: messageText,
        },
      };
    } else {
      // Send text message
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.whatsappPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageText,
        },
      };
    }

    const metaRes = await fetch(
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

    const metaJson = await metaRes.json();

    if (!metaRes.ok || metaJson.error) {
      console.error('Meta WhatsApp API error:', metaJson);
      return NextResponse.json({
        success: false,
        apiConfigured: true,
        error: metaJson.error?.message || 'Failed to send WhatsApp message via Meta Cloud API',
      });
    }

    return NextResponse.json({
      success: true,
      apiConfigured: true,
      message: `Certificate sent successfully via WhatsApp to ${normalizedPhone.displayPhone}`,
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
