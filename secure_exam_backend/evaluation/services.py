from decimal import Decimal
from security.models import AnswerKey
from security.encryption import decrypt_answer_key

def grade_attempt(attempt):
    score = Decimal("0")
    for student_answer in attempt.answers.select_related("question"):
        question = student_answer.question
        if question.question_type not in ["MCQ", "TRUE_FALSE", "MULTI_SELECT"]:
            continue
        try:
            key = AnswerKey.objects.get(question=question)
            correct = decrypt_answer_key(key.ciphertext, key.key_version)
        except AnswerKey.DoesNotExist:
            continue
        submitted = student_answer.answer
        if submitted == correct:
            score += question.marks
        elif attempt.exam.negative_marking:
            score -= attempt.exam.negative_marking
    return max(score, Decimal("0"))
