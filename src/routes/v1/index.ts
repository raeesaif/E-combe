import { Router } from 'express';
import authRoutes from '../auth.routes';
import categoryRoutes from '../category.routes';
import productRoutes from '../product.routes';
import cartRoutes from '../cart.routes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/addtocart', cartRoutes);
router.use('/cart', cartRoutes);

export default router;
