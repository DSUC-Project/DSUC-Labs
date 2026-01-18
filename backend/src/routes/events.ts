import { Router, Request, Response, RequestHandler } from 'express';
import { db } from '../index';
import { authenticateWallet } from '../middleware/auth';

const router = Router();

// GET /api/events - Get all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const { upcoming, limit } = req.query;

    let query = db
      .from('events')
      .select('*');

    // Filter upcoming events only
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date', today);
    }

    // Order by date
    query = query.order('date', { ascending: true });

    // Limit results
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: events,
      count: events?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/events/recent - Get 3 most recent upcoming events (for Dashboard)
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: events, error } = await db
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: events,
      count: events?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/events - Create new event (requires authentication)
router.post('/', authenticateWallet as any, (async (req: Request, res: Response) => {
  try {
    const { title, date, time, type, location } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title and date are required',
      });
    }

    const eventData = {
      title,
      date,
      time,
      type: type || 'Workshop',
      location,
      attendees: 0,
      created_by: req.user!.id,
    };

    const { data: newEvent, error } = await db
      .from('events')
      .insert([eventData])
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
      data: newEvent,
      message: 'Event created successfully',
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}) as RequestHandler);

// PUT /api/events/:id - Update event (requires authentication)
router.put('/:id', authenticateWallet as any, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, time, type, location, attendees } = req.body;

    // Check if event exists
    const { data: existingEvent, error: fetchError } = await db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
      });
    }

    // Only creator or admin can update
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead'];
    if (existingEvent.created_by !== req.user!.id && !adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this event',
      });
    }

    const updateData: any = {};

    if (title) updateData.title = title;
    if (date) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (type) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (attendees !== undefined) updateData.attendees = attendees;

    const { data: updatedEvent, error } = await db
      .from('events')
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
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}) as RequestHandler);

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', authenticateWallet as any, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin can delete
    const adminRoles = ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead'];
    if (!adminRoles.includes(req.user!.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can delete events',
      });
    }

    const { error } = await db
      .from('events')
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
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}) as RequestHandler);

// POST /api/events/:id/register - Register for event (increment attendees)
router.post('/:id/register', authenticateWallet as any, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current event
    const { data: event, error: fetchError } = await db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
      });
    }

    // Increment attendees
    const { data: updatedEvent, error } = await db
      .from('events')
      .update({ attendees: event.attendees + 1 })
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
      data: updatedEvent,
      message: 'Registered for event successfully',
    });
  } catch (error: any) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}) as RequestHandler);

export default router;
