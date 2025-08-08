export const MICROSERVICES = {
    NOTIFICATION_SERVICE: 'notification_service_process',
    PAYMENT_SERVICE: 'payment_service_process',
    USER_SUBSCRIPTION_SERVICE: 'user_subscription_service_process', // Uncomment if needed
};

export const MICROSERVICES_MESSAGE_COMMANDS = {
    NOTIFICATION_SERVICE: {
        TRIGGER_NOTIFICATION: 'notification_service_trigger_notification',
        TRIGGER_EMAIL: 'notification_service_trigger_email',
    },
    PAYMENT_SERVICE: {
        CREATE_PAYMENT_INTENT: 'payment_service_create_payment_intent',
        CONFIRM_PAYMENT: 'payment_service_confirm_payment',
        PROCESS_PAYMENT: 'payment_service_process_payment',
        REFUND_PAYMENT: 'payment_service_refund_payment',
        CANCEL_PAYMENT: 'payment_service_cancel_payment',
    }
};

