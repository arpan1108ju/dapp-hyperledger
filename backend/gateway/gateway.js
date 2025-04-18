
let gateway = null;

export const getGateway = () => gateway;

export const setGateway = (newGateway) => {
    gateway = newGateway;
};

export const resetGateway = () => {
    gateway = null;
};
