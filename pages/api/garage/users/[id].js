const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const garageMiddleware = require('../../../../middlewares/garageMiddleware');

export default async function handler(req, res) {
    const {
        query: { id },
        method,
    } = req;

    await dbConnect();

    // Vérifier l'authentification et le rôle garage
    const garage = await garageMiddleware(req, res);
    if (!garage) return;

    switch (method) {
        case 'GET':
            try {
                const user = await User.findOne({ _id: id, garageId: garage._id });

                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found or not authorized' });
                }

                res.status(200).json({ success: true, data: user });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'PUT':
            try {
                // Empêcher la modification du rôle ou du garageId par le garage
                const updates = { ...req.body };
                delete updates.role;
                delete updates.garageId;
                delete updates.password; // Gérer le changement de mot de passe séparément si nécessaire pour la sécurité

                const user = await User.findOneAndUpdate(
                    { _id: id, garageId: garage._id },
                    updates,
                    {
                        new: true,
                        runValidators: true,
                    }
                );

                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found or not authorized' });
                }

                res.status(200).json({ success: true, data: user });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'DELETE':
            try {
                const deletedUser = await User.findOneAndDelete({ _id: id, garageId: garage._id });

                if (!deletedUser) {
                    return res.status(404).json({ success: false, message: 'User not found or not authorized' });
                }

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
