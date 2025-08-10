export const MICROSERVICES = {
    NOTIFICATION_SERVICE: 'notification_service_process',
    PAYMENT_SERVICE: 'payment_service_process',
    USER_SUBSCRIPTION_SERVICE: 'user_subscription_service_process',
};

export const MICROSERVICES_MESSAGE_COMMANDS = {
    NOTIFICATION_SERVICE: {
        TRIGGER_NOTIFICATION: 'notification_service_trigger_notification',
        TRIGGER_EMAIL: 'notification_service_trigger_email',
    },
    PAYMENT_SERVICE: {
        VALIDATE_PAYMENT_ID: 'payment_service_validate_payment_id',
        CREATE_PAYMENT_INTENT: 'payment_service_create_payment_intent',
        UPDATE_SUBSCRIPTION: 'payment_service_update_subscription',
        CANCEL_SUBSCRIPTION: 'payment_service_cancel_subscription',
        CREATE_PLAN: 'payment_service_create_plan',
        UPDATE_PLAN: 'payment_service_update_plan',
        DELETE_PLAN: 'payment_service_delete_plan',
    },
    USER_SUBSCRIPTION_SERVICE: {
        CREATE_SUBSCRIPTION: 'user_subscription_service_create_subscription',
        UPDATE_SUBSCRIPTION: 'user_subscription_service_update_subscription',   
        CANCEL_SUBSCRIPTION: 'user_subscription_service_cancel_subscription',
    }
};
