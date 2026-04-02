let { Resend } = require('resend');

const resend = new Resend('re_fnhX2Jj2_LGp6copnvR7xYUwHMCScRKba');

module.exports = {
    sendMail: async function (to, url) {
        await resend.emails.send({
            from: 'support@veritashop.click',
            to: to,
            subject: 'Reset mật khẩu',
            html: `<p>Click vào <a href="${url}">đây</a> để đặt lại mật khẩu. Link hết hạn sau 10 phút.</p>`
        });
    }
}
