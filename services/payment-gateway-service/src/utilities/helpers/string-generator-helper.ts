export const generatePlanId = (): string => {
    return `plan_${Math.random().toString(36).substring(2, 15)}`;
}

export const generateClientSecret = (): string => {
    return `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`;
}

