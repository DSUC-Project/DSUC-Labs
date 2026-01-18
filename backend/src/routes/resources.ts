import { Router, Request, Response } from 'express';
import { db } from '../index';
import { authenticateWallet } from '../middleware/auth';

const router = Router();

// GET /api/resources - Get all resources
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, type } = req.query;

    let query = db
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: resources,
      count: resources?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/resources/categories - Get all resource categories with counts
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // Get all resources grouped by category
    const { data: resources, error } = await db
      .from('resources')
      .select('category');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    // Count resources by category
    const categoryCounts: { [key: string]: number } = {};
    resources?.forEach((resource: any) => {
      const cat = resource.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/resources/:id - Get resource by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: resource, error } = await db
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Resource not found',
      });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/resources - Create new resource (requires authentication)
router.post('/', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { name, type, url, size, category } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name and URL are required',
      });
    }

    const resourceData = {
      name,
      type: type || 'Link',
      url,
      size,
      category: category || 'Learning',
      created_by: req.user!.id,
    };

    const { data: newResource, error } = await db
      .from('resources')
      .insert([resourceData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data: newResource,
      message: 'Resource created successfully',
    });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// PUT /api/resources/:id - Update resource
router.put('/:id', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, url, size, category } = req.body;

    // Check if resource exists
    const { data: existingResource, error: fetchError } = await db
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingResource) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Resource not found',
      });
    }

    // Only creator or admin can update
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead'];
    if (existingResource.created_by !== req.user!.id && !adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this resource',
      });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (url) updateData.url = url;
    if (size !== undefined) updateData.size = size;
    if (category) updateData.category = category;

    const { data: updatedResource, error } = await db
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// DELETE /api/resources/:id - Delete resource (Admin only)
router.delete('/:id', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin can delete
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead'];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete resources',
      });
    }

    const { error } = await db
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
