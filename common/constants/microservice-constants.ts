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
    },
    USER_SUBSCRIPTION_SERVICE: {
        CREATE_SUBSCRIPTION: 'user_subscription_service_create_subscription',
        UPGRADE_SUBSCRIPTION: 'user_subscription_service_upgrade_subscription',
        CANCEL_SUBSCRIPTION: 'user_subscription_service_cancel_subscription',
    }
};

export const MICROSERVICES_MESSAGE_EVENTS = {
    NOTIFICATION_SERVICE: {
        NOTIFICATION_SENT: 'notification_service_notification_sent',
        EMAIL_SENT: 'notification_service_email_sent',
    },
    PAYMENT_SERVICE: {
        PAYMENT_INTENT_CREATED: 'payment_service_payment_intent_created',
        PAYMENT_CONFIRMED: 'payment_service_payment_confirmed',
        PAYMENT_PROCESSED: 'payment_service_payment_processed',
        PAYMENT_REFUNDED: 'payment_service_payment_refunded',
        PAYMENT_CANCELLED: 'payment_service_payment_cancelled',
    }
};
