import RPi.GPIO as GPIO
from time import sleep
GPIO.setmode(GPIO.BOARD)
GPIO.setup(11, GPIO.OUT)
pwm=GPIO.PWM(11, 50)
pwm.start(0)
pwm.ChangeDutyCycle(0) # left -90 deg position
sleep(1)
pwm.ChangeDutyCycle(10) # left -90 deg position
sleep(1)
pwm.stop()
GPIO.cleanup()
print("Locked")
