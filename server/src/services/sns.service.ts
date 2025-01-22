// src/services/sns.service.ts
import AWS from 'aws-sdk';
import { config } from 'dotenv';

config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const sns = new AWS.SNS();

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const formattedNumber = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+91${phoneNumber}`; // Assuming Indian numbers

    const params = {
      Message: message,
      PhoneNumber: formattedNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    const result = await sns.publish(params).promise();
    console.log('SMS sent successfully:', result.MessageId);
    return result.MessageId;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};