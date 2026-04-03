import 'package:flutter/material.dart';
import 'dart:math' as math;

class CityGymLogo extends StatelessWidget {
  final double size;
  final bool showTagline;

  const CityGymLogo({super.key, this.size = 120, this.showTagline = true});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _LogoPainter(),
          ),
        ),
        const SizedBox(height: 10),
        RichText(
          textAlign: TextAlign.center,
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'CITY ',
                style: TextStyle(
                  color: Color(0xFF3A3A3A),
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 3,
                ),
              ),
              TextSpan(
                text: 'GYM',
                style: TextStyle(
                  color: Color(0xFF26BDB8),
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 3,
                  decoration: TextDecoration.underline,
                  decorationColor: Color(0xFF26BDB8),
                  decorationThickness: 2,
                ),
              ),
            ],
          ),
        ),
        if (showTagline) ...[
          const SizedBox(height: 4),
          const Text(
            "IT'S A LIFE STYLE",
            style: TextStyle(
              color: Color(0xFF8A8A8A),
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: 2.5,
            ),
          ),
        ],
      ],
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const teal = Color(0xFF26BDB8);
    const grey = Color(0xFF9A9A9A);
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width * 0.44;

    // Grey arc background (partial circle)
    final arcPaint = Paint()
      ..color = grey.withValues(alpha: 0.35)
      ..strokeWidth = size.width * 0.065
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      math.pi * 0.75,
      math.pi * 1.5,
      false,
      arcPaint,
    );

    final bodyPaint = Paint()
      ..color = teal
      ..style = PaintingStyle.fill;

    // ── Female figure (left) ──────────────────────────────────
    final fl = cx - size.width * 0.22;
    final fTop = cy - size.height * 0.30;

    // Head
    canvas.drawCircle(Offset(fl, fTop), size.width * 0.072, bodyPaint);

    // Body (slightly curved shape)
    final bodyPath = Path()
      ..moveTo(fl - size.width * 0.045, fTop + size.width * 0.10)
      ..quadraticBezierTo(
          fl - size.width * 0.085, fTop + size.width * 0.22,
          fl - size.width * 0.05, fTop + size.width * 0.38)
      ..lineTo(fl + size.width * 0.05, fTop + size.width * 0.38)
      ..quadraticBezierTo(
          fl + size.width * 0.085, fTop + size.width * 0.22,
          fl + size.width * 0.045, fTop + size.width * 0.10)
      ..close();
    canvas.drawPath(bodyPath, bodyPaint);

    // Legs
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(fl - size.width * 0.055, fTop + size.width * 0.36,
            size.width * 0.048, size.width * 0.30),
        const Radius.circular(4),
      ),
      bodyPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(fl + size.width * 0.007, fTop + size.width * 0.36,
            size.width * 0.048, size.width * 0.30),
        const Radius.circular(4),
      ),
      bodyPaint,
    );

    // Arms raised slightly
    final armPaint = Paint()
      ..color = teal
      ..strokeWidth = size.width * 0.038
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(fl - size.width * 0.04, fTop + size.width * 0.14),
      Offset(fl - size.width * 0.13, fTop + size.width * 0.22),
      armPaint,
    );
    canvas.drawLine(
      Offset(fl + size.width * 0.04, fTop + size.width * 0.14),
      Offset(fl + size.width * 0.13, fTop + size.width * 0.22),
      armPaint,
    );

    // ── Male figure (right) ──────────────────────────────────
    final ml = cx + size.width * 0.22;
    final mTop = cy - size.height * 0.30;

    // Head
    canvas.drawCircle(Offset(ml, mTop), size.width * 0.072, bodyPaint);

    // Body (broader shoulders)
    final mBodyPath = Path()
      ..moveTo(ml - size.width * 0.085, mTop + size.width * 0.10)
      ..lineTo(ml + size.width * 0.085, mTop + size.width * 0.10)
      ..lineTo(ml + size.width * 0.060, mTop + size.width * 0.38)
      ..lineTo(ml - size.width * 0.060, mTop + size.width * 0.38)
      ..close();
    canvas.drawPath(mBodyPath, bodyPaint);

    // Legs
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(ml - size.width * 0.065, mTop + size.width * 0.36,
            size.width * 0.055, size.width * 0.30),
        const Radius.circular(4),
      ),
      bodyPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(ml + size.width * 0.010, mTop + size.width * 0.36,
            size.width * 0.055, size.width * 0.30),
        const Radius.circular(4),
      ),
      bodyPaint,
    );

    // Arms raised (exercise pose)
    canvas.drawLine(
      Offset(ml - size.width * 0.08, mTop + size.width * 0.12),
      Offset(ml - size.width * 0.18, mTop + size.width * 0.05),
      armPaint,
    );
    canvas.drawLine(
      Offset(ml + size.width * 0.08, mTop + size.width * 0.12),
      Offset(ml + size.width * 0.18, mTop + size.width * 0.05),
      armPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
