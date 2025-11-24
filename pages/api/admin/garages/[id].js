const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const adminMiddleware = require('../../../../middlewares/adminMiddleware');

export default async function handler(req, res) {
    const {
        query: { id },
        method,
    } = req;

    await dbConnect();

    // Vérifier l'authentification et le rôle admin
    const admin = await adminMiddleware(req, res);
    if (!admin) return;

    switch (method) {
        case 'GET':
            try {
                const garage = await User.findOne({ _id: id, role: 'garage' });

                if (!garage) {
                    return res.status(404).json({ success: false, message: 'Garage not found' });
                }

                res.status(200).json({ success: true, data: garage });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'PUT':
            try {
                const updates = { ...req.body };
                // On peut permettre à l'admin de modifier le rôle si nécessaire, mais attention aux effets de bord
                // Pour l'instant on laisse tout modifiable sauf le mot de passe via cette route (sécurité basique)
                delete updates.password;

                const garage = await User.findOneAndUpdate(
                    { _id: id, role: 'garage' },
                    updates,
                    {
                        new: true,
                        runValidators: true,
                    }
                );

                if (!garage) {
                    return res.status(404).json({ success: false, message: 'Garage not found' });
                }

                res.status(200).json({ success: true, data: garage });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'DELETE':
            try {
                const deletedGarage = await User.findOneAndDelete({ _id: id, role: 'garage' });

                if (!deletedGarage) {
                    return res.status(404).json({ success: false, message: 'Garage not found' });
                }

                // Optionnel : Supprimer aussi tous les utilisateurs liés à ce garage ?
                // await User.deleteMany({ garageId: id });

                res.status(200).json({ success: true, data: {} });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        default:
            res.status(400).json({ success: false });
            break;
    }
}
