from django.db import models
from django.contrib.auth.models import User

class SubjectChoices(models.TextChoices):
    PROGRAMMING = "programming", "Programming"
    LANGUAGE = "language", "Language"
    DESIGN = "design", "Design"
    SOFT_SKILLS = "soft_skills", "Soft Skills"

class Habit(models.Model):
    class FrequencyChoices(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="habits")
    topic = models.CharField(max_length=255)
    subject = models.CharField(max_length=50, choices=SubjectChoices.choices)
    frequency = models.CharField(max_length=20, choices=FrequencyChoices.choices)
    estimated_time = models.PositiveIntegerField()
    start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Habit: {self.topic}"

class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="study_sessions")
    habit = models.ForeignKey(Habit, on_delete=models.SET_NULL, null=True, blank=True, related_name="study_sessions")
    topic = models.CharField(max_length=255)
    subject = models.CharField(max_length=50, choices=SubjectChoices.choices)
    duration = models.PositiveIntegerField()
    notes = models.TextField(blank=True)
    studied_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.topic} on {self.studied_at.date()}"
