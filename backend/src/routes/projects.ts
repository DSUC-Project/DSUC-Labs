import { Router, Request, Response } from 'express';
import { db } from '../index';
import { authenticateWallet } from '../middleware/auth';
import { uploadBase64ToSupabase } from '../middleware/upload';

const router = Router();

// GET /api/projects - Get all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let query = db
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: projects,
      count: projects?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/projects - Create new project (requires authentication)
router.post('/', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { name, description, category, builders, link, repo_link, image_url } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Project name is required',
      });
    }

    const projectData: any = {
      name,
      description,
      category,
      builders: builders || [],
      link,
      repo_link,
      created_by: req.user!.id,
    };

    // Handle image upload if it's base64
    if (image_url && image_url.startsWith('data:image')) {
      try {
        const uploadedImageUrl = await uploadBase64ToSupabase(image_url, 'projects');
        projectData.image_url = uploadedImageUrl;
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          error: 'Upload Error',
          message: `Failed to upload image: ${uploadError.message}`,
        });
      }
    } else if (image_url) {
      projectData.image_url = image_url;
    }

    const { data: newProject, error } = await db
      .from('projects')
      .insert([projectData])
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
      data: newProject,
      message: 'Project created successfully',
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// PUT /api/projects/:id - Update project (requires authentication)
router.put('/:id', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, builders, link, repo_link, image_url } = req.body;

    // Check if project exists and user has permission
    const { data: existingProject, error: fetchError } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found',
      });
    }

    // Only creator or admin can update
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead'];
    if (existingProject.created_by !== req.user!.id && !adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this project',
      });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (builders) updateData.builders = builders;
    if (link !== undefined) updateData.link = link;
    if (repo_link !== undefined) updateData.repo_link = repo_link;

    // Handle image upload if it's base64
    if (image_url && image_url.startsWith('data:image')) {
      try {
        const uploadedImageUrl = await uploadBase64ToSupabase(image_url, 'projects');
        updateData.image_url = uploadedImageUrl;
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          error: 'Upload Error',
          message: `Failed to upload image: ${uploadError.message}`,
        });
      }
    } else if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    const { data: updatedProject, error } = await db
      .from('projects')
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
      data: updatedProject,
      message: 'Project updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', authenticateWallet as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin can delete
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead'];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete projects',
      });
    }

    const { error } = await db
      .from('projects')
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
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
