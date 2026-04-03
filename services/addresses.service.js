let addressModel = require('../schemas/addresses');

function buildAddressText(address) {
    return [
        address.detail,
        address.ward,
        address.district,
        address.province
    ].filter(Boolean).join(', ');
}

module.exports = {
    getMyAddresses: async function (userId) {
        return await addressModel.find({
            user: userId,
            isDeleted: false
        }).sort({ isDefault: -1, updatedAt: -1 });
    },

    getById: async function (id, userId) {
        return await addressModel.findOne({
            _id: id,
            user: userId,
            isDeleted: false
        });
    },

    create: async function (userId, data) {
        let count = await addressModel.countDocuments({
            user: userId,
            isDeleted: false
        });

        if (data.isDefault) {
            await addressModel.updateMany(
                { user: userId, isDeleted: false },
                { isDefault: false }
            );
        }

        let newAddress = new addressModel({
            user: userId,
            fullName: data.fullName,
            phone: data.phone,
            province: data.province,
            district: data.district,
            ward: data.ward,
            detail: data.detail,
            isDefault: count === 0 ? true : !!data.isDefault
        });

        await newAddress.save();
        return newAddress;
    },

    update: async function (id, userId, data) {
        let address = await addressModel.findOne({
            _id: id,
            user: userId,
            isDeleted: false
        });

        if (!address) {
            return null;
        }

        if (data.isDefault) {
            await addressModel.updateMany(
                { user: userId, isDeleted: false },
                { isDefault: false }
            );
        }

        address.fullName = data.fullName ?? address.fullName;
        address.phone = data.phone ?? address.phone;
        address.province = data.province ?? address.province;
        address.district = data.district ?? address.district;
        address.ward = data.ward ?? address.ward;
        address.detail = data.detail ?? address.detail;
        if (typeof data.isDefault === 'boolean') {
            address.isDefault = data.isDefault;
        }

        await address.save();
        return address;
    },

    remove: async function (id, userId) {
        let address = await addressModel.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                isDeleted: false
            },
            {
                isDeleted: true,
                isDefault: false
            },
            { new: true }
        );

        if (!address) {
            return null;
        }

        let defaultAddress = await addressModel.findOne({
            user: userId,
            isDeleted: false,
            isDefault: true
        });

        if (!defaultAddress) {
            let newestAddress = await addressModel.findOne({
                user: userId,
                isDeleted: false
            }).sort({ updatedAt: -1 });

            if (newestAddress) {
                newestAddress.isDefault = true;
                await newestAddress.save();
            }
        }

        return address;
    },

    setDefault: async function (id, userId) {
        let address = await addressModel.findOne({
            _id: id,
            user: userId,
            isDeleted: false
        });

        if (!address) {
            return null;
        }

        await addressModel.updateMany(
            { user: userId, isDeleted: false },
            { isDefault: false }
        );

        address.isDefault = true;
        await address.save();
        return address;
    },

    getOrderAddressText: async function (userId, orderData) {
        if (orderData.shippingAddress && orderData.shippingAddress.trim()) {
            return orderData.shippingAddress.trim();
        }

        if (orderData.addressId) {
            let address = await addressModel.findOne({
                _id: orderData.addressId,
                user: userId,
                isDeleted: false
            });

            if (!address) {
                throw new Error('Khong tim thay dia chi');
            }

            return buildAddressText(address);
        }

        let defaultAddress = await addressModel.findOne({
            user: userId,
            isDeleted: false,
            isDefault: true
        });

        if (!defaultAddress) {
            throw new Error('Ban chua co dia chi giao hang');
        }

        return buildAddressText(defaultAddress);
    }
};
