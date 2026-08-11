from django.contrib import admin
from .models import Habit, StudySession

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'subject', 'frequency', 'start_date')
    list_filter = ('subject', 'frequency', 'start_date')
    search_fields = ('topic', 'user__username')

@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'subject', 'duration', 'studied_at')
    list_filter = ('subject', 'studied_at')
    search_fields = ('topic', 'user__username')
