const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const protect = require('../middleware/auth');

// CREATE a task
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, deadline, status } = req.body;

        const task = await Task.create({
            user: req.user.id,
            title,
            description,
            deadline,
            status,
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all tasks for logged in user (with filtering & sorting)
router.get('/', protect, async (req, res) => {
    try {
        const { status, search, sortBy } = req.query;

        // Build filter object
        let filter = { user: req.user.id };

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        // Build sort object
        let sort = { createdAt: -1 }; // default: newest first

        if (sortBy === 'deadline') {
            sort = { deadline: 1 };
        } else if (sortBy === 'oldest') {
            sort = { createdAt: 1 };
        }

        const tasks = await Task.find(filter).sort(sort);
        res.json(tasks);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE a task
router.put('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure the task belongs to the logged in user
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE a task
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure the task belongs to the logged in user
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await task.deleteOne();

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;